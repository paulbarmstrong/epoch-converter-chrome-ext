const isoRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/
const tenYearsMillis = 1000 * 60 * 60 * 24 * 365 * 5
const tenYearsAgoEpochMillis = Date.now() - tenYearsMillis
const tenYearsFutureEpochMillis = Date.now() + tenYearsMillis
let isoMode = false
const observer = new MutationObserver((mutations) => {
	tagEpochElements(mutations.map(mutation => mutation.target))
})

chrome.runtime.onMessage.addListener(enable => {
	onChangeEnabledState(enable)
})

chrome.storage.local.get("enabled", res => {
	onChangeEnabledState(res.enabled)
})

function onChangeEnabledState(enable) {
	if (enable) {
		tagEpochElements(Array.from(document.getElementsByTagName("*")))
		observer.observe(document.body, { attributes: true, childList: true, subtree: true })
	} else {
		observer.disconnect()
		untagEpochElements()
	}
}

function getEpochElements() {
	return Array.from(document.querySelectorAll(".epochConverter"))
}

function tagEpochElements(elements) {
	elements
		.filter(el => {
			if (!isStringPositiveInteger(el.textContent)) return false
			const num = parseInt(el.textContent)
			return (
				(num > tenYearsAgoEpochMillis && num < tenYearsFutureEpochMillis) ||
				(num > tenYearsAgoEpochMillis/1000 && num < tenYearsFutureEpochMillis/1000)
			)
		})
		.forEach(el => {
			el.existingTextContent = el.textContent
			if (!el.classList.contains("epochConverter")) {
				el.addEventListener("mouseup", toggleIsoMode)
				if (el.existingCursor === undefined) el.existingCursor = el.style.cursor
				if (el.existingTextDecoration === undefined) el.existingTextDecoration = el.style.textDecoration
				el.style.cursor = "pointer"
				el.style.textDecoration = "underline dotted"
				el.classList.add("epochConverter")
			}
		})
	refreshEpoch()
}

function untagEpochElements() {
	getEpochElements().forEach(el => {
		el.removeEventListener("mouseup", toggleIsoMode)
		el.textContent = el.existingTextContent
		el.style.textDecoration = el.existingTextDecoration
		el.style.cursor = el.existingCursor
		el.classList.remove("epochConverter")
		delete el.existingTextContent
		delete el.existingTextDecoration
		delete el.existingCursor
	})
}

function toggleIsoMode() {
	isoMode = !isoMode
	refreshEpoch()
}

function refreshEpoch() {
	getEpochElements().forEach(el => {
		if (isoMode) {
			const num = parseInt(el.existingTextContent)
			const epochMillis = (num > tenYearsAgoEpochMillis && num < tenYearsFutureEpochMillis) ? (
				num
			) : (
				num * 1000
			)
			el.textContent = (new Date(epochMillis)).toISOString()
		} else {
			el.textContent = el.existingTextContent
		}
	})
}

function isStringPositiveInteger(str) {
	return /^[0-9]+$/.test(str)
}