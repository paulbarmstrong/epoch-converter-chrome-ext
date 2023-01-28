const tenYearsMillis = 1000 * 60 * 60 * 24 * 365 * 5
const tenYearsAgoEpochMillis = Date.now() - tenYearsMillis
const tenYearsFutureEpochMillis = Date.now() + tenYearsMillis
let isoMode = false
let enabledMode = false
let initialScanDone = false
const observer = new MutationObserver((mutations) => {
	if (initialScanDone) {
		tagEpochElements(mutations.map(mutation => mutation.target))
	} else {
		tagEpochElements(Array.from(document.getElementsByTagName("*")))
		initialScanDone = true
	}
})

let epochElements = new Map()

chrome.runtime.onMessage.addListener(enable => {
	onChangeEnabledState(enable)
})

chrome.storage.local.get("enabled", res => {
	onChangeEnabledState(res.enabled)
})

function onChangeEnabledState(enable) {
	if (enable && !enabledMode) {
		tagEpochElements(Array.from(document.getElementsByTagName("*")))
		observer.observe(document.body, { attributes: true, childList: true, subtree: true })
	} else if (!enable && enabledMode) {
		observer.disconnect()
		untagEpochElements()
	}
	enabledMode = enable
}

function getEpochElements() {
	epochElements = new Map(Array.from(epochElements.entries()).filter(([k, v]) => k !== undefined))
	return Array.from(epochElements.entries())
}

function tagEpochElements(elements) {
	const candidates = elements
		.filter(el => {
			if (!isStringPositiveInteger(el.textContent)) return false
			const num = parseInt(el.textContent)
			return (
				(num > tenYearsAgoEpochMillis && num < tenYearsFutureEpochMillis) ||
				(num > tenYearsAgoEpochMillis/1000 && num < tenYearsFutureEpochMillis/1000)
			)
		})

	const candidatesAndEpoch = candidates.concat(...Array.from(epochElements.keys()))
	candidates
		.filter(el => {
			let target = el
			while (target.parentNode) {
				if (candidatesAndEpoch.includes(target.parentNode)) return false
				target = target.parentNode
			}
			return true
		})
		.forEach(el => {
			if (!epochElements.has(el)) {
				el.addEventListener("mouseup", toggleIsoMode)
				epochElements.set(el, {
					existingText: el.textContent,
					existingCursor: el.style.cursor,
					existingTextDecoration: el.style.textDecoration
				})
			}
			epochElements.get(el).existingText = el.textContent
		})
	refreshEpoch()
}

function untagEpochElements() {
	getEpochElements().forEach(([el, props]) => {
		el.removeEventListener("mouseup", toggleIsoMode)
		setText(el, props.existingText)
		el.style.cursor = props.existingCursor
		el.style.textDecoration = props.existingTextDecoration
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
			const num = parseInt(props.existingText)
			const epochMillis = (num > tenYearsAgoEpochMillis && num < tenYearsFutureEpochMillis) ? (
				num
			) : (
				num * 1000
			)
			setText(el, (new Date(epochMillis)).toISOString())
		} else {
			setText(el, props.existingText)
		}
		el.style.cursor = "pointer"
		el.style.textDecoration = "underline dotted"
	})
}

function isStringPositiveInteger(str) {
	return /^[0-9]+$/.test(str)
}

function setText(el, text) {
	let target = el
	while (target.firstChild) target = target.firstChild
	target.textContent = text
}