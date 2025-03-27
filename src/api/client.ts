import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://mock.apidog.com/m1/523540-0-default', // Replace with the actual API base URL
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
