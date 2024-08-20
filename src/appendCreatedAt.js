const appendCreatedAt = (jsonData) => {
  const now = Date.now();
  jsonData.shapes = jsonData.shapes.map((shape) => ({
    ...shape,
    meta: { createdAt: now },
  }));
  return jsonData;
};

export default appendCreatedAt;
