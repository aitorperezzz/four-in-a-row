class ButtonManager {
    constructor() {
        this.buttons = {};
    }

    register(name, text, handler) {
        this.buttons[name] = { text: text, handler: handler };
    }

    removeAllButtons() {
        const buttonArea = document.getElementById('button-area');
        buttonArea.innerHTML = '';
    }

    appendButton(name) {
        const buttonArea = document.getElementById('button-area');
        let button = document.createElement('button');
        button.setAttribute('class', 'button');
        button.innerHTML += this.buttons[name].text;
        button.addEventListener('click', this.buttons[name].handler);
        buttonArea.appendChild(button);
    }
}