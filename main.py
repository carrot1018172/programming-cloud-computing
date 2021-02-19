from flask import Flask, request, session, render_template, redirect, url_for, abort
import os, uuid, time, json
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_admin import firestore



def load_json(path):
    with open(path, mode="r") as f:
        return json.loads(f.read())

def dump_json(object):
    return json.dumps(object)

def get_cookie(key):
    if key in session:
        return session[key]
    else:
        return None

def get_alert_message():
    mes = get_cookie("alert_message")
    if not mes is None:
        session.pop("alert_message")
    return mes

def get_db_ref(collection, document=None):
    if document is None:
        return db.collection(collection)
    else:
        return db.collection(collection).document(document)

def get_db(collection, document=None, field=None):
    if document is None and field is None:
        data = get_db_ref(collection).get()
        return {datum.id: datum.to_dict() for datum in data}
    elif field is None:
        data = get_db_ref(collection, document).get()
        return data.to_dict()
    elif document is None:
        data = get_db_ref(collection).get()
        return {datum.id: datum.to_dict()[field] if field in datum.to_dict() else None for datum in data}
    else:
        data = get_db_ref(collection, document).get()
        return data.to_dict()[field]

def set_db(newdata, collection, document=None):
    if document is None:
        for key in newdata:
            ref = get_db_ref(collection, key)
            ref.set(newdata[key], merge=True)
    else:
        ref = get_db_ref(collection, document)
        ref.set(newdata, merge=True)



pictures = load_json("pictures.json")
htmldata = load_json("htmldata.json")


if os.path.exists("ae-ryotamotonishi-6058a992713a.json"):
    cred = credentials.Certificate("ae-ryotamotonishi-6058a992713a.json")
    firebase_admin.initialize_app(cred)
else:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {"projectId": "ae-ryotamotonishi"})

db = firestore.client()

app = Flask(__name__)
app.secret_key = "cloud_computing"



@app.route("/<name>")
def main(name):
    if name in ["login", "apply"] and request.referrer not in [url_for("main", name="login"), url_for("main", name="apply")]:
        session["referrer"] = request.referrer
    if name == "favicon.ico":
        return redirect(url_for('static', filename='images/favicon.ico'))
    elif "apple-touch-icon" in name:
        return redirect(url_for('static', filename='images/favicon.png'))
    elif name in htmldata:
        return render_template("empty.html", data=htmldata[name])
    elif os.path.exists("templates/"+name+".html"):
        return render_template(name+".html", pictures=pictures, alert_message=get_alert_message())
    else:
        abort(404)



@app.route("/picture/<name>")
def picture_detail(name):
    if name in pictures:
        index = pictures.index(name)
        maxp = len(pictures)
        back = None
        forward = None
        if index > 0:
            back = pictures[index-1]
        if index < maxp-1:
            forward = pictures[index+1]
        return render_template("picture_detail.html", picture=name, back=back, forward=forward, index=str(index+1), maxp=str(maxp))
    else:
        return redirect(url_for("main", name="picture"))



@app.route("/setting")
def setting():
    account = get_cookie("loginaccount")
    user = get_db("members", account)
    if user != None:
        user["password"] = None
    return render_template("setting.html", user=user, alert_message=get_alert_message())



@app.route("/messages/fragment")
def mes_fragment():
    account = get_cookie("loginaccount")
    if account == None:
        abort(404)
    arg_n = request.args.get("n")
    arg_n = 20 if arg_n is None else int(arg_n)
    arg_from = request.args.get("from")
    arg_until = request.args.get("until")

    messages = get_db_ref("messages")
    messages_array = None

    if arg_from is None and arg_until is None:
        # 一応実装したけど使わない
        messages = messages.order_by("time", direction=firestore.Query.DESCENDING).limit(arg_n).stream()
        messages_array = list(reversed([message.to_dict() for message in messages]))
    elif arg_until is None:
        messages = messages.order_by("time", direction=firestore.Query.ASCENDING).where("time", ">", float(arg_from)).stream()
        messages_array = [message.to_dict() for message in messages]
    elif arg_from is None:
        messages = messages.order_by("time", direction=firestore.Query.DESCENDING).where("time", "<", float(arg_until)).limit(arg_n).stream()
        messages_array = list(reversed([message.to_dict() for message in messages]))
    else:
        # 一応実装したけど使わない
        messages = messages.order_by("time", direction=firestore.Query.ASCENDING).where("time", ">", float(arg_from)).where("time", "<", float(arg_until))
        messages_array = [message.to_dict() for message in messages]

    if len(messages_array) == 0:
        return ("", 204)

    all_mem = get_db("members", None, "displayname")
    members_dict = {mem: all_mem[mem] for mem in [mes["sender"] for mes in messages_array] if mem in all_mem}

    return dump_json({"messages": messages_array, "members": members_dict, "loginaccount": account})


@app.route("/logout")
def logout():
    if "loginaccount" in session:
        session.pop("loginaccount")
    if request.referrer == None:
        return redirect(url_for("root"))
    else:
        return redirect(request.referrer)



@app.route("/login", methods=["post"])
def login_post():
    identifier = None
    account = request.form["account"]
    password = request.form["password"]
    users = get_db("members")
    for key in users:
        user = users[key]
        if user["account"] == account and user["password"] == password:
            identifier = key
            break
    else:
        session["alert_message"] = "アカウント名またはパスワードが違います"
        return redirect(url_for("main", name="login"))

    session["loginaccount"] = identifier
    referrer = get_cookie("referrer")
    if referrer == None:
        return redirect(url_for("root"))
    else:
        session.pop("referrer")
        return redirect(referrer)



@app.route("/apply", methods=["post"])
def apply_post():
    identifier = str(uuid.uuid4())
    account = request.form["account"]
    password = request.form["password"]
    displayname = request.form["displayname"]
    members = get_db("members", None, "account")
    if account in [members[identifier] for identifier in members]:
        session["alert_message"] = "既に使われているアカウント名です"
        return redirect(url_for("main", name="apply"))
    else:
        set_db({
            "account": account,
            "password": password,
            "displayname": displayname
        }, "members", identifier)
        session["loginaccount"] = identifier
        return redirect(url_for("root"))



@app.route("/setting", methods=["post"])
def setting_post():
    identifier = get_cookie("loginaccount")
    user = get_db("members", identifier)

    if "new_account" in request.form:
        new_account = request.form["new_account"]
        password = request.form["password"]
        if user["password"] == password:
            set_db({
                "account": new_account
            }, "members", identifier)

    elif "new_password" in request.form:
        new_password = request.form["new_password"]
        password = request.form["password"]
        if user["password"] == password:
            set_db({
                "password": new_password
            }, "members", identifier)

    elif "new_displayname" in request.form:
        new_displayname = request.form["new_displayname"]
        set_db({
            "displayname": new_displayname
        }, "members", identifier)

    elif "withdraw" in request.form:
        password = request.form["password"]
        if user["password"] == password:
            get_db_ref("members", identifier).delete()
            session.pop("loginaccount")
            return redirect(url_for("main", name="withdrew"))

    session["alert_message"] = "アカウント名またはパスワードが違います"

    return redirect(url_for("main", name="setting"))



@app.route("/messages", methods=["post"])
def message_post():
    identifier = str(uuid.uuid4())
    message = request.form["message"]
    account = get_cookie("loginaccount")
    if account != None:
        set_db({
            "time": time.time(),
            "sender": account,
            "message": message
        }, "messages", identifier)
    return ("", 204)



@app.route("/")
def root():
    return redirect(url_for("main", name="home"))



@app.errorhandler(404)
def page_not_found(error):
    return redirect(url_for("main", name="404"))



if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=False)
