const setButton = document.getElementById('basicDBButton');
const databaseText = document.getElementById('databaseOutputText')


setButton.addEventListener('click', () => {
  window.electronAPI.pushToDatabase();
})


async function loadContent() {
  // Update the tag to connect renderer with main process
  const data = await window.electronAPI.grabAllDataFromDatabase();
  console.log(data)
  databaseText.innerText = data;
};


loadContent();