
const toggleButton = document.querySelector("#toggleButton")
chrome.storage.local.get("enabled", res => update(res.enabled ? true : false))
toggleButton.onclick = function toggle() {
	chrome.storage.local.get("enabled", res => update(res.enabled ? false : true))
}

function update(newEnabled) {
	chrome.storage.local.set({enabled: newEnabled})
	toggleButton.textContent = newEnabled ? "toggle_on" : "toggle_off"
	chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, newEnabled)
    })
}