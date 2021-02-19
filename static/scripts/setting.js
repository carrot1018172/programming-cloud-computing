window.addEventListener('DOMContentLoaded', (event) => {
    inputChanged();
});

function changeClicked(object) {
    const p = object.parentNode;
    const form = p.nextElementSibling;
    p.style.display = "none";
    form.style.display = "block";
    const input = form.getElementsByTagName("input")[0];
    inputChanged(input);
    input.select();
}

function cancelClicked(object) {
    object.parentNode.parentNode.style.display = "none";
    object.parentNode.parentNode.previousElementSibling.style.display = "unset";
}

function inputChanged(object) {
    if (object === undefined) { return }
    const inputs = Array.from(object.parentNode.getElementsByTagName("input"));
    const texts = inputs.filter(element => element.type == "text");
    const passwords = inputs.filter(element => element.type == "password");
    const checkboxes = inputs.filter(element => element.type == "checkbox");
    const submit = inputs.filter(element => element.type == "submit")[0];
    const isfilled = (texts.concat(passwords)).every(element => element.value != "") && checkboxes.every(element => element.checked);
    var isPasswordSame = true;
    if (passwords.length > 2) {
        isPasswordSame = passwords[1].value == passwords[2].value;
    }
    submit.disabled = !(isfilled && isPasswordSame);
    if (isPasswordSame) {
        passwords[2].nextElementSibling.innerHTML = "";
    } else {
        passwords[2].nextElementSibling.innerHTML = "パスワードが一致しません";
    }
}
