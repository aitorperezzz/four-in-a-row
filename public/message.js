class Message {
    constructor() {
        this.text = undefined;
        this.color = 255;
        this.size = undefined;
        this.xpos = undefined;
        this.ypos = undefined;
    }

    setText(text) {
        this.text = text;
    }

    setColor(color) {
        this.color = color;
    }

    resize(xpos, ypos, size) {
        this.xpos = xpos;
        this.ypos = ypos;
        this.size = size;
    }

    draw() {
        if (this.text) {
            fill(this.color);
            noStroke();
            textSize(this.size);
            textAlign(CENTER, CENTER);
            text(this.text, this.xpos, this.ypos);
        }
    }
}