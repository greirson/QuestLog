import React, { useState } from 'react';
import Task from './View';
import CalendarView from '../../utils/CalendarView';
import { LayoutList, Calendar } from 'lucide-react';

const TaskList = ({ tasks, removeTask, completeTask, isCompleted, addTask, updateTask }) => {
  const [quickTaskInput, setQuickTaskInput] = useState('');
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks'); 

  const handleQuickAdd = (e) => {
    if (e.key === 'Enter' && quickTaskInput.trim()) {
      addTask({
        name: quickTaskInput.trim(),
        desc: '',
        difficulty: 5,
        importance: 5,
        deadline: null,
        collaborative: false,
        experience: 150
      });
      setQuickTaskInput('');
    }
  };

  // Separate tasks and projects
  const { regularTasks, projects } = tasks.reduce((acc, task) => {
    if (task.subtasks) {
      acc.projects.push(task);
    } else {
      acc.regularTasks.push(task);
    }
    return acc;
  }, { regularTasks: [], projects: [] });

  // Sort tasks based on active tab
  const itemsToDisplay = activeTab === 'tasks' ? regularTasks : projects;
  const sortedTasks = [...itemsToDisplay].sort((a, b) => {
    // Tasks without deadlines go last
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // Group tasks by date
  const groupedTasks = sortedTasks.reduce((groups, task) => {
    if (!task.deadline) {
      if (!groups['No due date']) groups['No due date'] = [];
      groups['No due date'].push(task);
    } else {
      const dateObj = new Date(task.deadline);
      const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
      
      const date = adjustedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(task);
    }
    return groups;
  }, {});

  const sortedGroups = Object.entries(groupedTasks).sort(([dateA], [dateB]) => {
    if (dateA === 'No due date') return 1;
    if (dateB === 'No due date') return -1;
    if (dateA !== 'No due date' && dateB !== 'No due date') {
      // Convert the formatted dates back to timestamps for comparison
      const dateAObj = new Date(dateA);
      const dateBObj = new Date(dateB);
      return dateAObj - dateBObj;
    }
    return 0;
  });

  return (
    <div className="flex flex-col items-center w-full bg-white dark:bg-gray-800 rounded-lg p-6 transition-colors duration-200">
      <div className="flex items-center justify-between w-full mb-6">
        {!isCompleted ? (
          <>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Quick add task..."
                value={quickTaskInput}
                onChange={(e) => setQuickTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickAdd(e);
                  }
                }}
                className="w-full px-3 py-2 sm:py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 
                       dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 
                       placeholder-gray-400 dark:placeholder-gray-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none hidden sm:block">
                press ⏎
              </div>
            </div>
            <button
              onClick={() => setIsCalendarView(!isCalendarView)}
              className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg 
                       text-gray-600 dark:text-gray-400 flex items-center gap-2"
            >
              {isCalendarView ? (
                <>
                  <LayoutList className="w-5 h-5" />
                  <span className="text-sm">List View</span>
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Calendar View</span>
                </>
              )}
            </button>
          </>
        ) : (
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 w-full text-center">
            Completed
          </h2>
        )}
      </div>

      {!isCompleted && !isCalendarView && (
        <div className="w-full flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 text-sm rounded-md transition-all duration-200 ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Tasks ({regularTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 text-sm rounded-md transition-all duration-200 ${
                activeTab === 'projects'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Projects ({projects.length})
            </button>
          </div>
        </div>
      )}

      {!isCompleted && isCalendarView ? (
        <CalendarView tasks={tasks} />
      ) : (
        <div className="space-y-8 w-full flex flex-col items-center">
          {sortedGroups.map(([date, dateTasks]) => (
            <div key={date} className="w-full flex flex-col items-center space-y-2">
              <div className="w-11/12 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {date}
              </div>
              <ul className="w-full flex flex-col items-center">
                {dateTasks.map((task) => (
                  <Task
                    key={task.id}
                    task={task}
                    removeTask={removeTask}
                    completeTask={completeTask}
                    isCompleted={isCompleted}
                    updateTask={updateTask}
                  />
                ))}
              </ul>
            </div>
          ))}
          {!isCompleted && sortedTasks.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              {activeTab === 'tasks' 
                ? "Type above for quick task or use Create + for more options"
                : "Use Create + to add a new project with subtasks"
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;