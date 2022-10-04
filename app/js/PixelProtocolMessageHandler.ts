import { Types } from "ably";
import { ClickableGrid, Rgb } from "./ClickableGrid";
import { PixelProtocolSerializer, SetPixelsMessage } from "@snakemode/matrix-driver";

export class PixelProtocolMessageHandler {

    private _deserializer: PixelProtocolSerializer;
    private _grid: ClickableGrid;

    constructor(grid: ClickableGrid) {
        this._grid = grid;
        this._deserializer = new PixelProtocolSerializer();
    }

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
}
