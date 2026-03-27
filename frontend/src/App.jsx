import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// Configuración de Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    }
  }
});

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Vista Pública: Cargar tareas (GET)
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error cargando:", err); }
  };

  useEffect(() => { fetchTasks(); }, []);

  // Funciones CRUD (Solo para Vista Privada)
  const addTask = async () => {
    if (!newTask.trim()) return;
    await fetch(`${API_URL}tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask.trim() }),
    });
    setNewTask('');
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`${API_URL}tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const handleKey = (e) => { if (e.key === 'Enter') addTask(); };

  return (
    <div className="container">

      {/* ── Header ── */}
      <header className="app-header">
        <h1>Gestor de <span>Tareas</span></h1>
        <p>Aplicación fullstack con servicios AWS</p>
        <div className="header-badges">
          <span className="badge">DynamoDB</span>
          <span className="badge">Lambda</span>
          <span className="badge">API Gateway</span>
          <span className="badge">Cognito</span>
        </div>
      </header>

      {/* ── Vista Pública ── */}
      <section className="card">
        <div className="card-title">🌐 Lista Global (Pública)</div>
        {tasks.length === 0
          ? <p className="empty-msg">No hay tareas todavía.</p>
          : (
            <ul className="task-list">
              {tasks.map(task => (
                <li key={task.id} className="task-item">
                  <span className="task-dot" />
                  {task.title}
                </li>
              ))}
            </ul>
          )
        }
      </section>

      {/* ── Vista Privada (protegida con Cognito) ── */}
      <Authenticator>
        {({ signOut, user }) => (
          <section className="card">
            <div className="card-title">🔒 Panel Privado</div>

            {/* Barra de usuario */}
            <div className="user-bar">
              <div className="user-badge">
                <div className="avatar">
                  {user.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                Hola, <strong>{user.username}</strong>
              </div>
              <button className="btn-signout" onClick={signOut}>
                Cerrar sesión
              </button>
            </div>

            {/* Formulario agregar tarea */}
            <div className="add-form">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe una nueva tarea…"
              />
              <button className="btn-primary" onClick={addTask}>Agregar</button>
            </div>

            {/* Lista CRUD */}
            {tasks.length === 0
              ? <p className="empty-msg">Aún no hay tareas. ¡Agrega una!</p>
              : (
                <ul className="crud-list">
                  {tasks.map(task => (
                    <li key={task.id} className="crud-item">
                      <span>{task.title}</span>
                      <button
                        className="btn-danger"
                        onClick={() => deleteTask(task.id)}
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )
            }
          </section>
        )}
      </Authenticator>

    </div>
  );
}

export default App;