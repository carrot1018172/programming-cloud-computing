window.addEventListener('DOMContentLoaded', (event) => {
    inputChanged();
});


function inputChanged() {
    const content = document.getElementById("content")
    const inputs = Array.from(content.getElementsByTagName("input"));
    const texts = inputs.filter(element => element.type == "text");
    const passwords = inputs.filter(element => element.type == "password");
    const submit = inputs.filter(element => element.type == "submit")[0];
    const isfilled = (texts.concat(passwords)).every(element => element.value != "");
    submit.disabled = !isfilled;
}
