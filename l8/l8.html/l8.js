document.getElementById("noteInput");
document.getElementById("noteText");
document.getElementById("notesList");
document.getElementById("search");

let notes = JSON.parse(localStorage.getItem("notes")) || [];

showNotes();

function addNote() {
  const noteInput = document.getElementById("noteInput");
  const noteTextArea = document.getElementById("noteText");

  const noteText = noteInput.value.trim() + " " + noteTextArea.value.trim();

  if (noteText.trim() !== "") {
    let note = {
      text: noteText,
      id: Date.now(),
    };

    notes.push(note);

    localStorage.setItem("notes", JSON.stringify(notes));

    showNotes();

    noteInput.value = "";
    noteTextArea.value = "";
  } else {
    alert("Please enter a note before adding.");
  }
}

function showNotes() {
  const notesList = document.getElementById("notesList");

  notesList.innerHTML = "";

  notes.forEach((note) => {
    const listItem = document.createElement("li");

    listItem.innerHTML = `
            <p>${note.text}</p>
            <button onclick="deleteNote(${note.id})">Delete</button>
        `;

    notesList.appendChild(listItem);
  });
}

function deleteNote(id) {
  notes = notes.filter((note) => note.id !== id);

  localStorage.setItem("notes", JSON.stringify(notes));

  showNotes();
}

function clearNotes() {
  if (confirm("Are you sure you want to clear all notes?")) {
    notes = [];
    localStorage.removeItem("notes");
    showNotes();
  }
}

function searchNotes() {
  const searchInput = document.getElementById("search").value.toLowerCase();

  const notesList = document.getElementById("notesList");
  ;

  notesList.innerHTML = "";

  const filteredNotes = notes.filter((note) =>
    note.text.toLowerCase().includes(searchInput),
  );

  filteredNotes.forEach((note) => {
    const listItem = document.createElement("li");

    listItem.innerHTML = `
            <p>${note.text}</p>
            <button onclick="deleteNote(${note.id})">Delete</button>
        `;

    notesList.appendChild(listItem);
  });
}
