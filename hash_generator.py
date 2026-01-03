from flask_bcrypt import Bcrypt

# Inizializzazione temporanea di Bcrypt
bcrypt = Bcrypt()

# *** SCEGLI QUI LA TUA PASSWORD ADMIN ***
password_scelta = "miaadminpass123"  # <--- Puoi cambiarla qui!

# Genera l'hash
hash_password = bcrypt.generate_password_hash(password_scelta).decode('utf-8')

print("IL TUO HASH È:")
print(hash_password)
print("---------------------------------------------------------------------------------------------------------------------------------")
print(f"La password in chiaro che stai usando è: {password_scelta}")