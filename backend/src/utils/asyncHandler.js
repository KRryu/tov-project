// 간단한 express async wrapper – 미들웨어/컨트롤러 try-catch 제거용
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 