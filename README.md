Interactive Lights
=================

A Node.js webapp, interacting with Ably over the Ably JavaScript SDK, and a hardware counterpart that subscribes to the message over MQTT on an Arduino.
When coloured lights are pressed in the web UI, the t-shirt lights up!

# Dependencies

- An Ably account and API key
- An Azure Account for hosting on production
- Node 12 (LTS)

## Local dev pre-requirements

You will need to host the API, and can do so using Azure functions, you will need to install the [Azure functions core tools](https://github.com/Azure/azure-functions-core-tools). In your terminal, run:

```bash
npm install -g azure-functions-core-tools
```

You will also need to set your API key for local development. In your terminal, run:

```bash
cd api
func settings add ABLY_API_KEY Your-Ably-Api-Key
```

Running these commands will encrypt your API key into the file `/api/local.settings.json`.
You don't need to check it in to source control, and even if you do, it won't be usable on another machine.

# Quickstart

* NPM install in the repository root
* Crete an Ably account to get an Ably API key - docs here
* Set your API key as explained in pre-requirements

```bash
cd api
func settings add ABLY_API_KEY Your-Ably-Api-Key
```

* Clone the [matrix-driver GitHub repo](https://github.com/snakemode/matrix-driver)

* Open the Arduino sketch file `./arduino/InteractiveLights/InteractiveLights.ino`
* Edit the Configuration.h file to add your Wifi and Ably credentials.
* Deploy the Arduino code to your `AdaFruit Feather Huzzah ESP8266`
* Run the `WebUI` by typing `npm run start`
* Browse to the running Web App and paint some pixels!


# Running the Web UI

We're using `snowpack` and the `Azure Functions SDK` to run our web app, and API respectively, you can run both together once you have the pre-requirements installed by typing

```bash
npm install
npm run start
```

# Teardown

It's split into two parts.

* `WebUI` - with a colour grid to paint on
* `HarwareUI` some C++ code written for the Arduino compatible hardware we're using.

# The Hardware UI

The hardware UI is made up of two things:

* An AdaFruit Feather Huzzah ESP8266
* A custom built wearable LED Matrix

# AdaFruit Feather Huzzah ESP8266

The AdaFruit Feather Huzzah is a low power, cheap Arduino compatible System-on-chip.

You can run C and C++ code on out of the box. 

It's a hobbiest chip, and you can write software for it using the Arduino IDE.

# The Wearable LED Matrix

The Hardware UI runs on a custom built Wearable LED Matrix. It's got a resolution of 16x16 pixels.

It's built out of NeoPixel strips, cut up and soldiered into a display shape.
NeoPixels 

It's wired together in **GLORIOUS SNAKE MODE**.

# SNAKE MODE

Snake mode is what happens when you optimise for soldering 256 pixels the (moderately, slightly, a little bit more practical) easy way instead of the long boring way.

Our pixels have an odd numbering scheme - the Pixel IDs of the addressable pixels look like this:

    <------------------------<------------------------<------------
    015 014 013 012 011 010 009 008 007 006 005 004 003 002 001 000
    ------------------------->------------------------>------------
    016 017 018 019 020 021 022 023 024 025 026 027 028 029 030 031
    <------------------------<------------------------<------------
    047 046 045 044 043 042 041 040 039 038 037 036 035 034 033 032
    ------------------------->------------------------>------------
    ................

Because of this somewhat unorthadox numbering scheme, the code running on our hardware translates regular, real people pixel Ids, into **GLORIOUS SNAKE IDS** transparently. This means that in our web app, we can address our pixels using the much more reasonable pixel Ids of

    000 001 002 003 004 005 006 007 008 009 010 011 012 013 014 015
    ------------------------->------------------------>------------
    016 017 018 019 020 021 022 023 024 025 026 027 028 029 030 031
    ------------------------->------------------------>------------
    ................


We love snake mode 🐍, it makes soldiering easier. And snakes are awesome. Shut up.

# The Web UI

The Web UI is a HTML and JavaScript app that represents the individual pixels on our Wearable LED Matrix with squares on the screen.

There's a colour picker at the top for people to select their brushes, and a clickable array of squares to paint onto.

# Why only specific colours?

The LED matrix works better with certain colour pallets because painting in light is hard you!
So we picked some safe colours to let people paint with. The pixels themselves are lit using
`RGB` values, but we're constraining our painting to colours we know look good on the hardware.

# Making the WebUI and the hardware talk

We're using the @snakemode/matrix-driver and Ably's JavaScript SDK in our `WebUI` to send messages to our hardware when a Pixel is clicked.

The cool thing is, all the other users of our `WebUI` are also subscribed to this messages, so their clients can update when other people paint cooperatively with them!

One of the cool features of Ably's `pub/sub` support, is that they support the `MQTT` protocol.

# Authenticating our WebUI

We're using the Ably SDKs `createTokenRequest` feature in our `WebUI` to provide all the front-end clients valid authentication to connect to our `stream`.

```js
const ably = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });
...
const channel = ably.channels.get(channelName, { params: { rewind: "2m" } } as any); // Includes history
await channel.attach();
```

This requires just a couple of lines of backend code on our `Node.js` server and an Ably API key.

```js
const client = new Ably.Realtime(config["ably-api-key"]);

app.get("/api/createTokenRequest", async (request, response) => {
  const tokenRequestData = await client.auth.createTokenRequest({ clientId: 'interactive-lights-ui' });
  response.send(tokenRequestData);
});
```

# What's MQTT

From MQTT.org

    MQTT is a machine-to-machine (M2M)/"Internet of Things" connectivity protocol. It was designed as an extremely lightweight publish/subscribe messaging transport. It is useful for connections with remote locations where a small code footprint is required and/or network bandwidth is at a premium.

# Ably and MQTT

So the cool thing about Ably supporting MQTT is that any messages we send in our browser or our `Node.js` process using the `JavaScript` SDK, are also sent out over the MQTT protocol automatically.

This means that we can use a lightweight MQTT library on our Feather Huzzah, and a simpler, more standard JavaScript / HTTP SDK in our browser.

MQTT is designed to be fast and responsive, so we can communicate between multiple devices and our clients with really low latency and low bandwidth requirements.

# What messages are we sending

In this version of the interactive-lights, we're using the `binary serializer` provided by the @snakemode/matrix-driver to send pixel data packed down into binary messages.

You can read about how we convert pixel data to MQTT messages [here](https://github.com/snakemode/matrix-driver#the-wire-protocol-and-binary-serializers)

We send messages for setting pixels, and clearing the screen.


# When are we sending them

The MQTT message exchanges follow the followng rules:

* When a `Pixel message` is received, `HardwareUi` should update corresponding light.
* When a `Pixel message` is received, `WebUI` should update corresponding light.
* When a `Clear message` is sent, the `WebUI` should reset
* When a `Clear message` is sent, the `HardwareUI` should reset

# Keeping the Web UI in sync

Because we want everyone to be painting together, we want to keep all our UIs in sync.

To do this, we're using `Ablys` "rewind" capability when we subscribe to our channel in the browser.
This retrieves the last two minutes of messages, which is a reasonable window to keep all the `WebUIs` in sync.

We could expand this with a paid Ably account to support a longer window of time.

**Subscribing to Pixel messages**
Because everything is subscribed to the same Ably channel we can update all the WebUIs whenever a `Pixel message` is seen.

We do this all in the JavaScript code in `/app/js/PixelProtocolMessageHandler.ts` in our repo.

```js
handle(message: Types.Message) {
    const bytes = new Uint8Array(message.data);
    const messageData = this._deserializer.deserialize(bytes);

    switch (messageData.constructor.name) {
        case "ControlMessage":
            this._grid.reset();
            break;
        case "SetPixelsMessage":
            const setPixelMessage = messageData as SetPixelsMessage;
            setPixelMessage.pixelValues.forEach(p => { this._grid.setPixelColor(p, p.color as Rgb); });
            break;

        default: break;
    }
}
```

We're using the exact same Serializer that the matrix-driver uses to send messages to the hardware, to deserialize and process those messags in our browser.

# How the hardware works

The hardware uses the snakemode/matrix-driver Arduino code that provides a general purpose "remote display driver" for our JavaScript code.

The first version of this project used it's own Arduino implementation, but once we built the more general Arduino driver, we backported it so we don't need to maintain specific code for this project.

The matrix-driver sketch polls MQTT for `PixelProtocol` messages - you can read about them [here](https://github.com/snakemode/matrix-driver#developers-guide).

What this means, is we can send pixels data using our TypeScript SDK, and the hardware will update any connected and configured display.

# Running the hardware

You'll need to follow the instructions in the [matrix-driver GitHub repo](https://github.com/snakemode/matrix-driver) to deploy the hardware drive to a compatible `Feather Huzzah`.

- Update the WiFi credentials with your own
- Add your own API key
- Build the .ino sketch and push it over USB to your hardware.

- You will need to make your own wearable LED matrix!
