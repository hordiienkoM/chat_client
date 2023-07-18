import {
  Cancellable,
  Payload,
  Requestable,
  RSocket,
  RSocketConnector,
} from 'rsocket-core'
import { WebsocketClientTransport } from 'rsocket-websocket-client'
import {
  encodeBearerAuthMetadata,
  encodeCompositeMetadata,
  encodeRoute,
  encodeSimpleAuthMetadata,
  WellKnownMimeType,
} from 'rsocket-composite-metadata'
import { Buffer as BufferPolyfill } from 'buffer'
import APPLICATION_JSON = WellKnownMimeType.APPLICATION_JSON
import MESSAGE_RSOCKET_COMPOSITE_METADATA = WellKnownMimeType.MESSAGE_RSOCKET_COMPOSITE_METADATA

// Заставляем работать буфер в браузере
declare let Buffer: typeof BufferPolyfill
globalThis.Buffer = BufferPolyfill

abstract class Controller<REQUEST, RESPONSE, RETURN> {
  protected abstract route: string

  protected request: REQUEST

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    request: REQUEST,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ignoreResponse: RESPONSE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ignoreReturnType: RETURN,
  ) {
    this.request = request
  }

  // ignore: RS и RT нужны исключительно для дженериков.
  // Я В ДУШЕ НЕ ЕБУ, ПОЧЕМУ ЭТО ТАК РАБОТАЕТ И СЧИТАЮ ЭТО БРЕДОМ
  // НО ПО ДРУГОМУ НИКАК, ВООБЩЕ НИКАК

  private _connection: Connection = {} as Connection

  get connection(): Connection {
    return this._connection
  }

  set connection(value: Connection) {
    this._connection = value
  }

  abstract process(onNext?: (data: any) => void): RETURN
}

export abstract class FireAndForget<REQUEST> extends Controller<
  REQUEST,
  void,
  void
> {
  process(): Promise<void> {
    return this.connection.fireAndForget<REQUEST>(this.route, this.request)
  }
}

export abstract class RequestResponse<REQUEST, RESPONSE> extends Controller<
  REQUEST,
  void,
  Promise<RESPONSE>
> {
  process(): Promise<RESPONSE> {
    return new Promise<RESPONSE>((resolve, reject) => {
      this.connection
        .requestResponse<REQUEST, RESPONSE>(this.route, this.request)
        .then(data => {
          if (data != null) {
            resolve(data)
          }
        })
        .catch(reason => {
          reject(reason)
        })
    })
  }
}

export abstract class RequestStream<REQUEST, RESPONSE> extends Controller<
  REQUEST,
  RESPONSE,
  Promise<Requestable & Cancellable>
> {
  process(
    onNext?: (
      data:
        | RESPONSE
        | {
            _isComplete: boolean
            _error?: Error
          },
    ) => void,
  ): Promise<Requestable & Cancellable> {
    return new Promise<Requestable & Cancellable>((resolve, reject) => {
      this.connection
        .requestStream<REQUEST, RESPONSE>(
          this.route,
          this.request,
          (data, isComplete, error) => {
            if (onNext != null) {
              if (data != null) {
                onNext({
                  ...data,
                  _isComplete: isComplete,
                  _error: error,
                })
              } else {
                onNext({
                  _isComplete: isComplete,
                  _error: error,
                })
              }
            }
          },
        )
        .then(flux => {
          resolve(flux)
        })
        .catch(reason => {
          reject(reason)
        })
    })
  }
}

export abstract class RequestChannel<REQUEST, RESPONSE> extends Controller<
  Array<REQUEST>,
  RESPONSE,
  Promise<Requestable & Cancellable>
> {
  process(
    onNext?: (data: RESPONSE | { _isComplete: boolean }) => void,
  ): Promise<Requestable & Cancellable> {
    return new Promise<Requestable & Cancellable>((resolve, reject) => {
      this.connection
        .requestChannel<REQUEST, RESPONSE>(
          this.route,
          this.request,
          (data, isComplete) => {
            if (onNext != null) {
              if (data != null) {
                onNext({
                  ...data,
                  _isComplete: isComplete,
                })
              } else {
                onNext({
                  _isComplete: isComplete,
                })
              }
            }
          },
        )
        .then(flux => {
          resolve(flux)
        })
        .catch(reason => {
          reject(reason)
        })
    })
  }
}

function encodeData(data: any): Buffer {
  const stringifyData = JSON.stringify(data)
  return Buffer.from(stringifyData)
}

function encodeRawData(data: any): Buffer {
  return Buffer.from(data)
}

function decodePayload(payload: Payload) {
  const { data } = payload
  if (data == null) return null
  const plain = data.toString()
  return JSON.parse(plain)
}

export default class Connection {
  private rsocketFuture: Promise<RSocket> | null = null

  private readonly metadata = new Map()

  private readonly streams = new Set()

  constructor(url: string) {
    this.connect(url)
  }

  public connect(url: string) {
    this.disconnect()
    const connector = new RSocketConnector({
      transport: new WebsocketClientTransport({
        url,
        wsCreator: url => new WebSocket(url),
      }),
      setup: {
        keepAlive: 10000,
        lifetime: 200000,
        dataMimeType: APPLICATION_JSON.string,
        metadataMimeType: MESSAGE_RSOCKET_COMPOSITE_METADATA.string,
      },
    })
    this.rsocketFuture = new Promise((resolve, reject) => {
      connector
        .connect()
        .then(rsocket => {
          rsocket.onClose(error => {
            if (error != null) {
              console.warn(
                error,
                'Connection closed with errors. Reconnecting..',
              )
              this.connect(url)
            }
          })
          resolve(rsocket)
        })
        .catch(reason => {
          reject(reason)
          console.warn(reason, 'Connection failed! Reconnecting..')
          this.connect(url)
        })
    })
  }

  public disconnect() {
    this.rsocketFuture?.then(value => {
      console.log('Closing previous connection')
      value.close()
    })
    this.rsocketFuture = null
  }

  public setBearerAuthentication(token: string) {
    this.metadata.set(
      WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION,
      encodeBearerAuthMetadata(token),
    )
  }

  public setSimpleAuthentication(username: string, password: string) {
    this.metadata.set(
      WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION,
      encodeSimpleAuthMetadata(username, password),
    )
  }

  public removeAuthentication() {
    this.metadata.delete(WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION)
  }

  public fireAndForget<REQUEST>(route: string, data: REQUEST): Promise<void> {
    return new Promise((resolve, reject) => {
      this.rsocketFuture?.then(rsocket => {
        const metadata = new Map(this.metadata)
        metadata.set(
          WellKnownMimeType.MESSAGE_RSOCKET_ROUTING,
          encodeRoute(route),
        )
        rsocket.fireAndForget(
          {
            data: encodeData(data),
            metadata: encodeCompositeMetadata(metadata),
          },
          {
            onError(error: Error) {
              reject(error)
            },
            onComplete() {
              resolve()
            },
          },
        )
      })
    })
  }

  public requestResponse<REQUEST, RESPONSE>(
    route: string,
    data: REQUEST,
  ): Promise<RESPONSE> {
    return new Promise((resolve, reject) => {
      this.rsocketFuture?.then(rsocket => {
        const metadata = new Map(this.metadata)
        metadata.set(
          WellKnownMimeType.MESSAGE_RSOCKET_ROUTING,
          encodeRoute(route),
        )
        rsocket.requestResponse(
          {
            data: encodeData(data),
            metadata: encodeCompositeMetadata(metadata),
          },
          {
            onNext(payload: Payload) {
              const data = decodePayload(payload)
              if (data.stackTrace != null && data.message != null) {
                reject(data.message)
              }
              resolve(data)
            },
            onExtension() // eslint-disable-next-line @typescript-eslint/no-empty-function
            {},
            onError(error: Error) {
              reject(error)
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onComplete() {},
          },
        )
      })
    })
  }

  public requestStream<REQUEST, RESPONSE>(
    route: string,
    data: REQUEST,
    onNext: (data: RESPONSE, isComplete: boolean, _error?: Error) => void,
  ): Promise<Requestable & Cancellable> {
    return new Promise((resolve, reject) => {
      this.rsocketFuture?.then(rsocket => {
        const metadata = new Map(this.metadata)
        metadata.set(
          WellKnownMimeType.MESSAGE_RSOCKET_ROUTING,
          encodeRoute(route),
        )
        const { streams } = this
        const stream = rsocket.requestStream(
          {
            data: encodeData(data),
            metadata: encodeCompositeMetadata(metadata),
          },
          0,
          {
            onNext(payload: Payload, isComplete: boolean) {
              onNext(decodePayload(payload), isComplete)
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onExtension() {},
            onError(error: Error) {
              onNext((null as unknown) as RESPONSE, false, error)
              reject(error)
            },
            onComplete() {
              onNext((null as unknown) as RESPONSE, true)
              streams.delete(stream)
            },
          },
        )
        streams.add(stream)
        resolve(stream)
      })
    })
  }

  public requestChannel<REQUEST, RESPONSE>(
    route: string,
    data: Array<REQUEST>,
    onNext: (data: RESPONSE, isComplete: boolean) => void,
  ): Promise<Requestable & Cancellable> {
    return new Promise((resolve, reject) => {
      this.rsocketFuture?.then(rsocket => {
        const metadata = new Map(this.metadata)
        metadata.set(
          WellKnownMimeType.MESSAGE_RSOCKET_ROUTING,
          encodeRoute(route),
        )
        const { streams } = this
        let index = 0
        const stream = rsocket.requestChannel(
          {
            data: null,
            metadata: encodeCompositeMetadata(metadata),
          },
          data.length + 1,
          false,
          {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            cancel(): void {},
            onComplete(): void {
              onNext((null as unknown) as RESPONSE, true)
              streams.delete(stream)
            },
            onError(error: Error): void {
              reject(error)
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onExtension(): void {},
            onNext(payload: Payload, isComplete: boolean): void {
              onNext(decodePayload(payload), isComplete)
            },
            request(): void {
              const isComplete: boolean = index == data.length - 1
              stream.onNext(
                {
                  data: encodeRawData(data[index]),
                },
                isComplete,
              )
              index++
            },
          },
        )
      })
    })
  }

  public process<
    REQUEST,
    RESULT,
    RETURN,
    C extends Controller<REQUEST, RESULT, RETURN>,
  >(
    Controller: new (
      request: REQUEST,
      response: RESULT,
      returnType: RETURN,
    ) => C,
    request: REQUEST,
    onNext?: (data: RESULT & { _isComplete: boolean; _error?: Error }) => void,
  ): RETURN {
    const processor = new Controller(
      request as REQUEST,
      {} as RESULT,
      {} as RETURN,
    )
    processor.connection = this
    return processor.process(onNext)
  }
}
