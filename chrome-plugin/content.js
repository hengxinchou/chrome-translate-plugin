chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { translatedText, selectedText } = request;

  const range = window.getSelection().getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const translatedDiv = document.createElement('div');

  translatedDiv.innerHTML = translatedText;
  translatedDiv.style.position = 'absolute';
  translatedDiv.style.backgroundColor = '#f0f0f0';
  translatedDiv.style.border = '1px solid #ccc';
  translatedDiv.style.padding = '5px';
  translatedDiv.style.zIndex = '1000';
  top_distance = Math.max(rect.top + window.scrollY - 60, 0)
  left_distance = Math.max(rect.left + window.scrollX, 0)
  translatedDiv.style.top = `${top_distance}px`;
  translatedDiv.style.left = `${left_distance}px`;

  document.body.appendChild(translatedDiv);

  //Automatically close pop in n seconds
  timeout = translatedText.length > 150 ?  10000 : 5000;
  setTimeout(() => {
    document.body.removeChild(translatedDiv);
  }, timeout); 
});
