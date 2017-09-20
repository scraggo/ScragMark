const bitUrlToken = "de87b3defa9c87bf1bbede1c9e07e415333e781e" // Should move this somewhere we can .gitignore it

chrome.commands.onCommand.addListener(command => {

  if (command === "ScragMark") {
    addBookmarkToStorage()
  }

  if (command === "Open Tab") {

    chrome.tabs.query({}, function(tabs) { // Only create new tab once.
      var doFlag = true;
      var myId = chrome.runtime.id;
      for (var i=tabs.length-1; i>=0; i--) {
        if (tabs[i].url === `chrome-extension://${myId}/note.html`) {
          doFlag = false;
          chrome.tabs.update(tabs[i].id, {active: true}); //focus it
          break;
        }
      }
      if (doFlag) { //it didn't found anything, so create it
        chrome.tabs.create({url: "note.html"});
      }
    });

  }

});

const getOptions = () => new Promise((resolve, reject) => {
  chrome.storage.local.get('options', result => {
    let shortenUrl = (result.options.shortenUrl) ? result.options.shortenUrl : false;
    // usage: options = getOptions(); options.shortenUrl. can be extended
    resolve({shortenUrl: shortenUrl});
  });
});

async function addBookmarkToStorage () { 
  let tabs = await getTabs();
  let url = tabs[0] ? tabs[0].url : "";
  let title = tabs[0] ? tabs[0].title : "";
  if (url === "" || title === "") {
    return;
  }

  let options = await getOptions();
  if (options.shortenUrl) {
    url = await getShortBitUrl(url, bitUrlToken)
  } // Otherwise its still the long URL that gets passed in
	
  let mdText = await getMdText() + `\n* [${title}](${url})`;
  await setMdText(mdText);
  flashSavedBadge();
}

const getMdText = () => new Promise((resolve, reject) => {
  chrome.storage.local.get('mdText', result => {
    let mdText = (result.mdText) ? result.mdText : "";
    resolve(mdText);
  });
});

const setMdText = (mdText) => new Promise((resolve, reject) => {
  chrome.storage.local.set({'mdText': mdText, 'bookmarkAdded' : true}, resolve);
});

const getTabs = () => new Promise((resolve, reject) => {
  chrome.tabs.query({active: true, currentWindow: true}, resolve);
});

const getShortBitUrl = (longUrl, token) => new Promise((resolve, reject) => {
  fetch(`https://api-ssl.bitly.com/v3/shorten?longURL=${encodeURI(longUrl)}&access_token=${token}`, { credentials: 'omit' })
    .then(response => response.json())
    .then(bitUrl => resolve(bitUrl.data.url));
});

const flashSavedBadge = () => {
  chrome.browserAction.setBadgeBackgroundColor({color:[0,0,255,255]});
  chrome.browserAction.setBadgeText({text:"Saved"}); 
  setTimeout(() => {
    chrome.browserAction.setBadgeText({text:""});  
  }, 2000);
}