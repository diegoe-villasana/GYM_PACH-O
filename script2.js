

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Subir muy lento a solo 10 usuarios
    { duration: '5m', target: 10 }, 
  ],
};

// 1. REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO DE SUPABASE
const SUPABASE_URL = 'https://gfsofbjhmorkgegnbsli.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc29mYmpobW9ya2dlZ25ic2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDEzMDUwMywiZXhwIjoyMDk1NzA2NTAzfQ.vJsNUZUeLZZuMheh-cFm-Zl2aMzzbsDzXyN8LnyJkZo';

const EMAIL = 'luis10villasana@hotmail.com';
const PASSWORD = 'Gym123';

export default function () {
  // Endpoint oficial de autenticación con contraseña en Supabase REST API
  const loginUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

  const payload = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  });

  const params = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  };

  // 2. Intentar hacer Login real contra Supabase
  const res = http.post(loginUrl, payload, params);

  // 3. Validar si Supabase respondió 200 OK y devolvió el token de acceso
  const success = check(res, {
    'login en Supabase exitoso (200)': (r) => r.status === 200,
    'obtuvo access_token': (r) => r.json('access_token') !== undefined,
  });

  if (!success) {
    console.error(`Error en login: Status ${res.status} - ${res.body}`);
  }

  sleep(5);
}