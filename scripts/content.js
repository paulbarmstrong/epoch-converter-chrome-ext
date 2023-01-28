const isoRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/
const tenYearsMillis = 1000 * 60 * 60 * 24 * 365 * 5
const tenYearsAgoEpochMillis = Date.now() - tenYearsMillis
const tenYearsFutureEpochMillis = Date.now() + tenYearsMillis
let isoMode = false
const observer = new MutationObserver((mutations) => {
	tagEpochElements(mutations.map(mutation => mutation.target))
})

let epochElements = new Map()

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
	epochElements = new Map(Array.from(epochElements.entries()).filter(([k, v]) => k !== undefined))
	return Array.from(epochElements.entries())
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
			if (!epochElements.has(el)) {
				epochElements.set(el, {
					existingTextContent: el.textContent
				})
				el.addEventListener("mouseup", toggleIsoMode)
			} else {
				epochElements.get(el).existingTextContent = el.textContent
			}
		})
	refreshEpoch()
}

function untagEpochElements() {
	getEpochElements().forEach(([el, props]) => {
		el.removeEventListener("mouseup", toggleIsoMode)
		el.textContent = props.existingTextContent
	})
	epochElements = new Map()
}

function toggleIsoMode() {
	isoMode = !isoMode
	refreshEpoch()
}

function refreshEpoch() {
	getEpochElements().forEach(([el, props]) => {
		if (isoMode) {
			const num = parseInt(props.existingTextContent)
			const epochMillis = (num > tenYearsAgoEpochMillis && num < tenYearsFutureEpochMillis) ? (
				num
			) : (
				num * 1000
			)
			el.textContent = (new Date(epochMillis)).toISOString()
		} else {
			el.textContent = props.existingTextContent
		}
	})
}

function isStringPositiveInteger(str) {
	return /^[0-9]+$/.test(str)
}