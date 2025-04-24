const setupReader = () => {
  const reader = new FileReader();
  reader.onerror = () => {
    console.error("Error reading file");
  };
  reader.onabort = () => {
    console.warn("File reading was aborted");
  };
  return reader;
};

export default setupReader;
