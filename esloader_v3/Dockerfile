# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory to
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

#RUN permanent to keep alive
CMD tail -f /dev/null