import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("AQ.Ab8RN6IXQRb08ePA3tODrsx7XYis00yeaxj6vnwdNSswDEgrOQ"))

for model in client.models.list():
    print(model.name)