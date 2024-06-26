import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import TaskCards from "./TaskCards";
import Header from "./Header";
import NewTaskModule from "./NewTaskModule";
import TaskModule from "./TaskModule";
import { useNavigate } from "react-router-dom";
import TaskPieChart from "../helper/pieChart";


const Dashboard = ({ }) => {
  const [isTaskModuleOpen, setTaskModuleOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userFname, setUserFname] = useState(null);
  const [department, setDepartment] = useState(null);
  const navigate = useNavigate();
  const [pieChartData, setPieChartData] = useState([10, 3, 2, 5]);
  // const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  // const apiPort = process.env.REACT_APP_API_PORT;
  // const editEvent = `${apiBaseUrl}:${apiPort}/editEvent`;
  // const editExpress = `${apiBaseUrl}:${apiPort}/expenseClaim`;
  // const deleteEvent = `${apiBaseUrl}:${apiPort}/delEvent`;
  // const delClaim = `${apiBaseUrl}:${apiPort}/delClaim`;



  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const userFname = localStorage.getItem("userFname");
    const department = localStorage.getItem("department");

    if (role && userId && userFname && department) {
      setUserRole(role);
      setUserId(userId);
      setUserFname(userFname);
      setDepartment(department);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const allTasksResponse = await fetch('http://localhost:8888/tasks');
        const allTasksData = await allTasksResponse.json();

        // Filter tasks based on user role and department
        let filteredTasks = allTasksData;
        if (userRole === 'Admin') {
          if (department === 'HR') {
            filteredTasks = allTasksData.filter(task => task.taskType === 'Event Idea');
          } else if (department === 'Account') {
            filteredTasks = allTasksData.filter(task => task.taskType === 'Expense');
          }
        } else if (userRole === 'User') {
          filteredTasks = allTasksData.filter(task => task.submitted_by === userId);
        }

        setTasks(filteredTasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    };

    if (userId) {
      fetchTasks();
    }
  }, [userId, userRole, department]);

  const statuses = ["Submitted", "In Progress", "Approved", "Rejected"];

  const handleOpenTask = (task) => {
    console.log("Task opened:", task);
    setTask(task);
    setIsTaskOpen(true);
  };

  const handleCloseTask = () => {
    setIsTaskOpen(false);
  };

  const handleOpenNewTask = () => {
    setTaskModuleOpen(true);
  };

  const handleCloseNewTask = () => {
    setTaskModuleOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8888/updateTaskStatus/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId ? { ...task, status: newStatus } : task
          )
        );
        console.log("Task status updated:", data);
      } else {
        const errorText = await response.text();
        console.error("Failed to update task status:", errorText);
        alert(`Failed to update task status: ${errorText}`);
      }
      handleCloseTask();
    } catch (error) {
      console.error("Failed to update task status:", error);
      alert(`Failed to update task status: ${error.message}`);
    }
  };

  const deleteTask = async (taskId) => {
    console.log("Deleting task:", taskId);
    try {
      const response = await fetch(`http://localhost:8888/delEvent/${taskId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Task deleted:", data);
        if (data.deletedCount > 0) {
          setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
        } else {
          console.warn("No tasks deleted, check if taskId is correct");
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to delete task:", errorText);
        alert(`Failed to delete task: ${errorText}`);
      }
      handleCloseTask();
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert(`Failed to delete task: ${error.message}`);
    }
  };


  // Calculate the number of approved tasks and the total number of tasks
  const totalTasks = tasks.length;
  const approvedTasks = tasks.filter(task => task.status === 'Approved').length;

  return (
    <Container maxWidth={false} sx={{ px: 5 }}>
      <Header
        userFname={userFname}
        userRole={userRole}
        onCreateTask={handleOpenNewTask}
        onLogout={handleLogout}
      />

{userRole === 'Admin' && (
        <Box sx={{ display: "flex", justifyContent: "space-between", fontFamily: 'Poppins, sans-serif' , mb: 4 , mt: 5 }}>
          <Box sx={{ marginLeft: 10 }}>
            <Typography variant="h5">Total Progress</Typography>
            <Typography variant="h3">{((approvedTasks / totalTasks) * 100).toFixed(0)}%</Typography>
            <Typography variant="h6">Tasks completed: {approvedTasks}</Typography>
            <Typography variant="h6">Total tasks: {totalTasks}</Typography>
          </Box>
          <Box sx={{ marginRight: 30 }}>
            <TaskPieChart tasks={tasks} />
          </Box>
        </Box>
      )}



      <Grid container spacing={3}>
        {statuses.map((status) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={status}>
            <Box
              sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2, mb: 3 }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}
              >
                {status}
              </Typography>
              <Grid container spacing={3}>
                {tasks
                  .filter((task) => task.status === status)
                  .map((task, index) => (
                    <Grid item xs={12} key={index}>
                      <Card onClick={() => handleOpenTask(task)} variant="outlined"
                        sx={{
                          mb: 2,
                          transition: "box-shadow 0.3s ease-in-out",
                          "&:hover": {
                            boxShadow: 6, // You can adjust the value for a stronger or softer shadow
                          },
                        }} >
                        <CardContent>
                          <TaskCards
                            title={task.title}
                            description={task.short_desc}
                            dueDate={task.due_date || task.dueDate}
                            priority={task.priority}
                            taskType={task.taskType}
                            userRole={userRole}
                            onInProgress={() => updateTaskStatus(task._id, 'In Progress')}
                            onApprove={() => updateTaskStatus(task._id, 'Approved')}
                            onReject={() => updateTaskStatus(task._id, 'Rejected')}
                            onDelete={() => deleteTask(task._id)}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          </Grid>
        ))}
      </Grid>

      <NewTaskModule
        task={{}}
        open={isTaskModuleOpen}
        onClose={handleCloseNewTask}

        id={userId}
      />
      <TaskModule
        task={task}
        open={isTaskOpen}
        onClose={handleCloseTask}
        userRole={userRole}
        onInProgress={() => updateTaskStatus(task._id, 'In Progress')}
        onApprove={() => updateTaskStatus(task._id, 'Approved')}
        onReject={() => updateTaskStatus(task._id, 'Rejected')}
        onDelete={() => deleteTask(task._id)}
      />
    </Container>
  );
};

export default Dashboard;
