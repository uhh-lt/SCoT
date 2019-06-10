# Use an official Python runtime as a parent image
FROM python:3.7

# Set the working directory to
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV FLASK_ENV="development"

# Run app.py when the container launches
CMD ["python", "scot.py"]