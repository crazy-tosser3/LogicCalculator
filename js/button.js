function addText(button) {
    var inputfield = document.getElementById("expression")
    inputfield.value += button.innerText;
}

function showMessage() {
    const shadow = document.querySelector('#shadow');
    const message = document.querySelector('#message');

    shadow.style.display = 'block';
    message.style.display = 'block';

    shadow.addEventListener('click', () => {
        shadow.style.display = 'none';
        message.style.display = 'none';
    }, { once: true });
}
