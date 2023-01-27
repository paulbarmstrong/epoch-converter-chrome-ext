
let enabled = true
const toggleButton = document.querySelector("#toggleButton")
toggleButton.onclick = function toggle() {
	console.log(toggleButton)
	enabled = !enabled
	toggleButton.textContent = enabled ? "toggle_on" : "toggle_off"
	chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, enabled);
    })
}