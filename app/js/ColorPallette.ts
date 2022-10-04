export class ColorPallette {

    public get activeColor() { return this._hex; }

    private _hex: string;

    constructor(selector: string) {
        this._hex = "#FFFFFF";

        const colors = [...document.getElementsByClassName(selector)];

        colors.forEach(item => {
            item.addEventListener("click", () => {
                this._hex = item.getAttribute("data-hex");
            });
        });
    }
}
