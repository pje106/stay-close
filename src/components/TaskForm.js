import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import "./App.css";

function TaskForm(props) {
  const [input, setInput] = useState("");
  const [inputs, setInputs] = useState([]);
  const [attachment, setAttachment] = useState();
  const { currentUser } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const taskArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInputs(taskArray);
    });
    inputRef.current.focus();
    return unsub;
  }, []);

  const onChange = (event) => {
    const {
      target: { value },
    } = event;
    setInput(value);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (input.length > 140) {
      alert("Please enter no more than 140 characters");
      return;
    }
    props.onSubmit({
      id: Math.floor(Math.random() * 10000),
      text: input,
    });
    setInput("");

    let fileURL = "";
    if (input === "") {
      return;
    }
    if (attachment !== "") {
      const fileRef = ref(storage, `${currentUser.uid}/${uuidv4()}`);
      const response = await uploadString(fileRef, attachment, "data_url");
      fileURL = await getDownloadURL(response.ref);
      console.log(fileURL);
    }
    const taskObj = {
      text: input,
      createdAt: Date.now(), //only this one can convert to date in ReadTasks
      creatorId: currentUser.uid,
      name: currentUser.displayName,
      fileURL,
    };
    await addDoc(collection(db, "tasks"), taskObj);
    setInput("");
    setAttachment("");
  };

  console.log(inputs);
  const onFileChange = (event) => {
    const {
      target: { files },
    } = event;
    const theFile = files[0];
    const reader = new FileReader();
    reader.onloadend = (finishedEvent) => {
      const {
        currentTarget: { result },
      } = finishedEvent;
      setAttachment(result);
    };
    reader.readAsDataURL(theFile);
  };
  const onClearAttachmentClick = () => setAttachment(null);

  return (
    <>
      <form onSubmit={onSubmit} className="todo-form">
        {props.edit ? (
          <>
            <input
              placeholder="Update your item"
              value={input}
              onChange={onChange}
              type="text"
              ref={inputRef}
              className="todo-input edit"
              maxLength={140}
            />
            <button onClick={onSubmit} className="todo-button edit">
              Update
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="✍️ what's something on your mind?"
              value={input}
              onChange={onChange}
              name="text"
              className="todo-input"
              ref={inputRef}
            />
            <button onClick={onSubmit} className="todo-button">
              Post it
            </button>
            <label
              htmlFor="attach-file"
              className="factoryInput__label"
            ></label>
            <input type="file" accept="image/*" onChange={onFileChange} />
            {attachment && (
              <div className="taskForm__attachment">
                <img src={attachment} width="300px" alt="" />
                <button onClick={onClearAttachmentClick}>Clear</button>
              </div>
            )}
          </>
        )}
      </form>
    </>
  );
}

export default TaskForm;
