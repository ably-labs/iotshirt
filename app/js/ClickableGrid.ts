export type OnSquareClick = (x: number, y: number) => void;
export type Dimensions = { width: number, height: number };
export type Coord = { x: number, y: number };
export type Rgb = { r: number, g: number, b: number };

export class ClickableGrid {
    private _dimensions: Dimensions;
    private _target: string;
    private _lookup: Map<String, HTMLElement>;
    private _onClick: OnSquareClick;

    constructor(target: string, deviceDimensions: Dimensions) {
        this._dimensions = deviceDimensions;
        this._target = target;
        this._lookup = new Map<String, HTMLElement>();
        this._onClick = () => { };
    }

    public onClick(onClick: OnSquareClick) {
        this._onClick = onClick;
    }

    public draw() {

        const pixels = document.getElementById(this._target);

        for (let y = 0; y < this._dimensions.height; y++) {

            const row = document.createElement("div");
            row.classList.add("row");

            for (let x = 0; x < this._dimensions.width; x++) {

                const square = document.createElement("div");
                square.classList.add("square");
                square.id = this.idFor({ x, y });

                square.addEventListener("click", (e) => { this._onClick(x, y); });

                row.appendChild(square);
                this._lookup.set(square.id, square);
            }

            pixels.appendChild(row);
        }
    }

    public setPixelColor(coord: Coord, color: Rgb) {
        const square = this.getSquare(coord);
        square.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    public reset() {
        for (var [key, element] of this._lookup) {
            element.style.backgroundColor = "black";
        }
    }

    public getSquare(coord: Coord) { return this._lookup.get(this.idFor(coord)); }
    private idFor(coord: Coord) { return `x${coord.x}-y${coord.y}`; }
}
