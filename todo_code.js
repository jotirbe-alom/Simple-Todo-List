// ✅ Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "*************************",
    authDomain: "simple-todolist-ba8f0.firebaseapp.com",
    projectId: "simple-todolist-ba8f0",
    storageBucket: "simple-todolist-ba8f0.firebasestorage.app",
    messagingSenderId: "873732565460",
    appId: "1:873732565460:web:1dbb5748d6648ef2e14e41",
    measurementId: "G-L114Q6XWM1"
};

// ✅ Initialize Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const todosRef = collection(db, "todos");

// ✅ Selectors
const todoList = document.getElementById("todo-list");
const addBtn = document.getElementById("add-btn");
const todoInput = document.getElementById("todo-input");
const searchBox = document.getElementById("search");

// 🌿 Functions to handle UI & sessionStorage
function createTodoElement(id, task, completed) {
    const li = document.createElement("li");
    li.setAttribute("data-id", id);
    li.innerHTML = `
        <span class="${completed ? "completed" : ""}">${task}</span>
        <div class="actions">
            <i class="fas fa-edit"></i>
            <i class="fas fa-trash"></i>
        </div>
    `;
    todoList.appendChild(li);
}

function saveTodosToSession() {
    const todos = [];
    todoList.querySelectorAll("li").forEach(li => {
        todos.push({
            id: li.getAttribute("data-id"),
            text: li.querySelector("span").innerText,
            completed: li.querySelector("span").classList.contains("completed")
        });
    });
    sessionStorage.setItem("todos", JSON.stringify(todos));
}

// 🌿 Load Todos from Firestore on startup
async function loadTodos() {
    // Clear existing UI and session data to avoid conflicts
    todoList.innerHTML = "";
    sessionStorage.removeItem("todos");

    try {
        const snapshot = await getDocs(todosRef);
        const todosToSave = [];
        snapshot.forEach(docSnap => {
            const todo = docSnap.data();
            createTodoElement(docSnap.id, todo.text, todo.completed);
            todosToSave.push({ id: docSnap.id, ...todo });
        });
        sessionStorage.setItem("todos", JSON.stringify(todosToSave));
        console.log("Todos loaded from Firestore and cached in sessionStorage.");
    } catch (err) {
        console.error("Error loading todos from Firestore:", err);
    }
}

// 🌿 Handle Add Todo
async function handleAddTodo(task) {
    try {
        const docRef = await addDoc(todosRef, { text: task, completed: false });
        createTodoElement(docRef.id, task, false);
        saveTodosToSession();
        todoInput.value = ""; // Clear input after adding
    } catch (err) {
        console.error("Error adding todo:", err);
    }
}

// 🌿 Event Listeners
addBtn.addEventListener("click", () => {
    const task = todoInput.value.trim();
    if (task !== "") {
        handleAddTodo(task);
    }
});

todoInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        const task = todoInput.value.trim();
        if (task !== "") {
            handleAddTodo(task);
        }
    }
});

todoList.addEventListener("click", async e => {
    const li = e.target.closest("li");
    if (!li) return;
    const id = li.getAttribute("data-id");
    const span = li.querySelector("span");
    const docRef = doc(db, "todos", id);

    if (e.target.classList.contains("fa-trash")) {
        await deleteDoc(docRef);
        li.remove();
        saveTodosToSession();
    }

    if (e.target.classList.contains("fa-edit")) {
        const newTask = prompt("Edit your task:", span.innerText);
        if (newTask && newTask.trim() !== "") {
            await updateDoc(docRef, { text: newTask.trim() });
            span.innerText = newTask.trim();
            saveTodosToSession();
        }
    }

    if (e.target.tagName === "SPAN") {
        const newStatus = !span.classList.contains("completed");
        await updateDoc(docRef, { completed: newStatus });
        span.classList.toggle("completed");
        saveTodosToSession();
    }
});

searchBox.addEventListener("keyup", () => {
    const term = searchBox.value.toLowerCase();
    Array.from(todoList.children).forEach(item => {
        const text = item.firstElementChild.textContent.toLowerCase();
        item.style.display = text.includes(term) ? "flex" : "none";
    });
});

// 🌿 Initial Load

loadTodos();
