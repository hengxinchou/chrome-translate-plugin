  document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get('translatedText', function (data) {


      // timeout = data.translatedText.length > 100 ?  10000 : 5000;
      timeout = 300000;
      //Automatically close pop in n seconds
      setTimeout(() => { window.close(); }, timeout);

      translatedText = data.translatedText;
      let translatedTextFinal;
      splitLength = 60;
      // console.log("###zhx99: " + translatedText.length);
      if( translatedText.length <= splitLength){
          // console.log("###zhx100");
         translatedTextFinal = translatedText;
      } else {
         translatedTextArray = lengthCutting(translatedText, splitLength);
         translatedTextFinal = translatedTextArray.join("<br>");
          console.log("###zhx101: " + translatedTextFinal);
      }
          console.log("###zhx102: " + translatedTextFinal);
      document.getElementById('translatedText').innerHTML = translatedTextFinal || 'No translation available.';
    });
  });

function lengthCutting(str, num) {
	if (str == null || str == undefined) return null;
	
	if (!(/^[0-9]*[1-9][0-9]*$/.test(num))) return null;
	
	let array = new Array(),
		len = str.length;
	
	for (let i = 0; i < (len / num); i++) {
		if ((i + 1) * num > len) {
			array.push(str.substring(i * num, len));
		} else {
			array.push(str.substring(i * num, (i + 1) * num));
		}
	}
	
	return array;
}
