import React, { useEffect, useState } from "react";
import API from "../../services/api";

const Stories = () => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    API.get("/stories").then(res => setStories(res.data));
  }, []);

  return (
    <div className="flex space-x-3 overflow-x-auto p-2 bg-white rounded shadow mb-4">
      {stories.map((story) => (
        <div key={story._id} className="relative w-20 h-28 rounded overflow-hidden border-2 border-blue-500">
          <img src={story.media} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
};

export default Stories;
