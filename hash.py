import sys
import hashlib

def hashfile(address, BUF_SIZE = 65536):
    sha256 = hashlib.sha256()
    with open(address, 'rb') as f:
        while True:
            data = f.read(BUF_SIZE)
            if not data:
                break
            sha256.update(data)

    return sha256.hexdigest()

print(hashfile('./uploads/im.png'))