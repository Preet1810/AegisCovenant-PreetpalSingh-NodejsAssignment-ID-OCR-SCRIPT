import React, { useState } from 'react'
import './App.css'
import { Formik, Form } from 'formik'
import axios from 'axios'
import CircularProgress from '@mui/material/CircularProgress';
axios.defaults.withCredentials=true;
const initialValues={
  picture: "",
};

const App=() => {
  const [image, setImage]=useState("https://res.cloudinary.com/dwh4llt0c/image/upload/v1680046745/Dolbie%20Test/pre_bz7ksw.png")
  const [isLoading, setIsLoading]=useState(false); // Add loading state
  const [data, setData]=useState();
  const [text, setText]=useState('');

  const handleFormSubmit=(values) => {
    setIsLoading(true);
    const formData=new FormData();
    formData.append("picture", values.picture);
    axios.post(`https://nodejsassignment-id-ocr.onrender.com/imagetotext`, formData, {

      headers: {
        "Content-Type": "multipart/form-data",
      },
    }).then((res) => {
      const jsonString=JSON.stringify(res.data.result, null, 2);
      setData(jsonString)
      setText(res.data.imageToText)
      setIsLoading(false);
    }).catch((err) => {
      console.log(err);
      setIsLoading(false);
    });
  }


  const handleUpload=(event) => {
    const file=event.target.files[0];
    const reader=new FileReader();
    reader.onload=(e) => {
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>

      <h1 className='mainH'>INDIAN ID OCR SCRIPT</h1>
      <p>When uploading an image, please ensure that it is well-cropped and clear. Please be patient and allow up to 3-4 minutes for the server to respond as it has limited resources.</p>
      <div className="container">
        <div className="box">
          <div className="card">
            <h3>ADD PAN/ADHAR CARD</h3>
            <img src={image} alt="Preview" />
          </div>
          <Formik
            onSubmit={handleFormSubmit}
            initialValues={initialValues}
          // validationSchema={postSchema}
          >
            {({
              errors,
              handleSubmit,
              setFieldValue, }) => (
              <Form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="file-input">
                    <input
                      id="file-input"
                      type="file"
                      accept=".png, .jpg, .jpeg"
                      required
                      onChange={(event) => {
                        setFieldValue("picture", event.currentTarget.files[0]);
                        handleUpload(event);
                      }}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                >
                  Submit
                </button>
              </Form>
            )}
          </Formik>
        </div>
        <div className='box'>

          <h3>IMAGE TO JSON</h3>
          {isLoading? (<CircularProgress />):(
            <pre>{data}</pre>
          )}

        </div>

        <div className='box'>

          <h3>IMAGE TO TEXT</h3>
          {isLoading? (<CircularProgress />):(
            <textarea name="imagetotext" id="" cols="50" rows="20" value={text} onChange={(e) => setText(e.target.value)} />
          )}

        </div>
      </div>
    </div>
  )
}

export default App
