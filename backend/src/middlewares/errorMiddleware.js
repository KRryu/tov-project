const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || '서버 에러가 발생했습니다.',
    });
  };
  
  module.exports = errorMiddleware;
  