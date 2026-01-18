import axios from 'axios';

export const useTaskOperations = (refreshData: () => void) => {

    const updateAssignee = async (taskId: number, assigneeId: number) => {
        try {
            await axios.put(`http://localhost:3000/api/tasks/${taskId}`, { assigneeId });
            refreshData();
        } catch (error) {
             console.error(error);
        }
    }

    const updatePriority = async (taskId: number, priority: string) => {
        try {
            await axios.put(`http://localhost:3000/api/tasks/${taskId}`, { priority });
            refreshData();
        } catch (error) {
             console.error(error);
        }
    }

    const updateDueDate = async (taskId: number, dueDate: string) => {
        try {
            await axios.put(`http://localhost:3000/api/tasks/${taskId}`, { dueDate });
            refreshData();
        } catch (error) {
             console.error(error);
        }
    }

    const addComment = async (taskId: number, content: string) => {
        try {
            await axios.post(`http://localhost:3000/api/tasks/${taskId}/comments`, { content });
            refreshData();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteTask = async (taskId: number) => {
        try {
            await axios.delete(`http://localhost:3000/api/tasks/${taskId}`);
            refreshData();
        } catch (error) {
            console.error(error);
        }
    }

    return {
        updateAssignee,
        updatePriority,
        updateDueDate,
        addComment,
        deleteTask
    };
}
