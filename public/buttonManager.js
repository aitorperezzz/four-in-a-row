class ButtonManager {
    constructor() {
        this.buttons = {};
    }

    register(name, text, handler) {
        this.buttons[name] = { text: text, handler: handler };
    }

    clear() {
        const buttonArea = document.getElementById('button-area');
        buttonArea.innerHTML = '';
    }

    append(name) {
        const buttonArea = document.getElementById('button-area');
        let button = document.createElement('button');
        button.setAttribute('class', 'button');
        button.setAttribute('id', name);
        button.innerHTML += this.buttons[name].text;
        button.addEventListener('click', this.buttons[name].handler);
        buttonArea.appendChild(button);
    }

    remove(name) {
        var button = document.getElementById(name);
        button.parentNode.removeChild(button);
    }
}