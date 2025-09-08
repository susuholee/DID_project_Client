import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,  // 모든 요청에 쿠키 포함
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - 모든 요청에 쿠키 포함
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 인증 실패 시 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized인 경우 쿠키가 만료되었거나 유효하지 않음
    if (error.response?.status === 401) {
      console.log('인증 실패 - 쿠키 만료 또는 유효하지 않음');
      // 필요시 로그아웃 처리
    }
    
    // 500 에러인 경우 서버 문제로 간주
    if (error.response?.status === 500) {
      console.error('서버 내부 오류:', error.response.data);
      // 서버 문제로 인한 에러는 조용히 처리
    }
    
    return Promise.reject(error);
  }
);

export default api;