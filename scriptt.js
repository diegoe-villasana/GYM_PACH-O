import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 50 }, // 50 usuarios en 10 minutos
  ],
};

export default function () {
  // Simula a un usuario entrando a la página principal
  const resHome = http.get('https://gym-pach-o.netlify.app/');
  
  check(resHome, {
    'home cargo OK (200)': (r) => r.status === 200,
  });

  sleep(1);

  // Simula al usuario navegando a la ruta de login (GET, no POST)
  const resLoginView = http.get('https://gym-pach-o.netlify.app/login');
  
  check(resLoginView, {
    'vista login cargo OK (200)': (r) => r.status === 200,
  });

  sleep(2);
}