# import libraries
from bs4 import BeautifulSoup
import re
import requests
import pandas as pd


df = pd.read_csv("data/minlib_extra_data.csv", names=["instance", "var", "constr", "bin", "int", "nl_constr","sense","dual","primal"])

for index, row in df.iterrows():
    instance = row['instance'].lower()
    sense = row['sense']
    if float(row['primal']) != 0.0 and float(row['dual']) != 0.0:
        continue

    print("Instance: ", instance)
    page = requests.get("http://www.minlplib.org/"+instance+".html")

    # parse the html using beautiful soup and store in variable `soup`
    soup = BeautifulSoup(page.text, "html.parser")

    tables = soup.find_all("table")
    trs = tables[0].find_all("tr")

    dual_bounds = []
    primal_bounds = []
    for tr in trs:
        tds = tr.find_all("td")
        span_tds0 = tds[0].find_all("span")
        if "Dual Bounds" in span_tds0[0].get_text():
            divs = tds[1].find_all("b")
            for div in divs:
                div_text = div.get_text()
                bound_obj = re.search(r"-?\d+\.\d+", div_text)
                dual_bounds.append(float(bound_obj.group()))
        if "Primal Bounds" in span_tds0[0].get_text():
            divs = tds[1].find_all("b")
            for div in divs:
                div_text = div.get_text()
                bound_obj = re.search(r"-?\d+\.\d+", div_text)
                primal_bounds.append(float(bound_obj.group()))

    dual_bound = "-"
    primal_bound = "-"
    if sense == "Min":
        if float(row['dual']) == 0.0:
            dual_bound = max(dual_bounds)
        if float(row['primal']) == 0.0:
            primal_bound = min(primal_bounds)
    else:
        if float(row['dual']) == 0.0:
            dual_bound = min(dual_bounds)
        if float(row['primal']) == 0.0:            
            primal_bound = max(primal_bounds)

    if float(row['dual']) == 0.0:
        df.ix[index,'dual'] = dual_bound
    if float(row['primal']) == 0.0:
        df.ix[index,'primal'] = primal_bound

    
    print("Dual Bound: ", dual_bound)
    print("Primal Bound: ", primal_bound)
    print("===================================")

    df.to_csv("data/minlib_extra_data.csv", index=False, header=False)