import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

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
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      setError('No se pudieron cargar las tareas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    const trimmed = newTask.trim();
    if (!trimmed) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const created = await res.json();
      setTasks(prev => [created, ...prev]);
      setNewTask('');
    } catch (err) {
      console.error('Error agregando tarea:', err);
      setError(`Error al agregar: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (err) {
      console.error('Error actualizando tarea:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error eliminando tarea:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addTask();
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-logo">✓</div>
        <h1 className="app-title">Gestor de Tareas</h1>
        <p className="app-subtitle">Organiza tu día con estilo</p>
      </header>

      <Authenticator>
        {({ signOut, user }) => (
          <main className="app-main">
            {/* User greeting */}
            <div className="user-bar">
              <div className="user-info">
                <span className="user-avatar">{(user.username || user.signInDetails?.loginId || 'U')[0].toUpperCase()}</span>
                <span className="user-name">{user.username || user.signInDetails?.loginId}</span>
              </div>
              <button className="btn-signout" onClick={signOut}>
                <span>⬡</span> Salir
              </button>
            </div>

            {/* Stats */}
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-num">{tasks.length}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">{completedCount}</span>
                <span className="stat-label">Completadas</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">{tasks.length - completedCount}</span>
                <span className="stat-label">Pendientes</span>
              </div>
            </div>

            {/* Add task */}
            <div className="add-task-card">
              <input
                className="task-input"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="¿Qué necesitas hacer hoy?"
                disabled={adding}
              />
              <button
                className="btn-add"
                onClick={addTask}
                disabled={adding || !newTask.trim()}
              >
                {adding ? '...' : '+'}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="error-banner">
                <span>⚠ {error}</span>
                <button onClick={() => setError('')}>✕</button>
              </div>
            )}

            {/* Task list */}
            <div className="task-list">
              {loading ? (
                <div className="empty-state">
                  <div className="spinner" />
                  <p>Cargando tareas...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No tienes tareas aún.<br/>¡Agrega tu primera tarea!</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className={`task-card ${task.completed ? 'done' : ''}`}>
                    <button
                      className="task-check"
                      onClick={() => toggleTask(task)}
                      title={task.completed ? 'Marcar pendiente' : 'Marcar completada'}
                    >
                      {task.completed ? '✓' : ''}
                    </button>
                    <span className="task-text">{task.title}</span>
                    <button
                      className="btn-delete"
                      onClick={() => deleteTask(task.id)}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {tasks.length > 0 && completedCount === tasks.length && (
              <div className="all-done">🎉 ¡Todo completado! Eres increíble.</div>
            )}
          </main>
        )}
      </Authenticator>
    </div>
  );
}

export default App;