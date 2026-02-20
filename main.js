

fetch('https://jsonplaceholder.typicode.com/todos/1')
    .then(response => response.json())
    .then(json => console.log(json))


document.getElementById('addNote').addEventListener ('click', e => createNote());

function createNote() {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';
    noteDiv.id = "noteN"
    noteDiv.innerHTML = `
      <label class="noteItem">
        <span class="noteCheckbox"></span>
        <span class="labelName">Default</span>
      </label>
    `;

    document.getElementById('noteList').insertBefore(noteDiv, document.getElementById('note2').nextSibling);
}


// Чтение клика по пункту, смена класса выполненности

document.getElementById('noteList').addEventListener('click', function(e) {
        e.target.closest('.noteItem').classList.toggle('isDone');
    })