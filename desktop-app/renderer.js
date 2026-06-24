const setButton = document.getElementById('basicDBButton');
const databaseText = document.getElementById('databaseOutputText')


setButton.addEventListener('click', () => {
  window.electronAPI.pushToDatabase();
})

window.addEventListener('keydown', (event) => {
  if (event.key == "F12") {
    window.electronAPI.devToolsSwitch();
  }
})


async function loadContent() {
  // Update the tag to connect renderer with main process
  const data = await window.electronAPI.grabAllDataFromDatabase();
  console.log(data.data)
  
  databaseText.innerText = `${data.data}`;
};


loadContent();