# import libraries
from bs4 import BeautifulSoup
import re
import requests
import pandas as pd


df = pd.read_csv("data/minlib_extra_data.csv", names=["instance", "var", "constr", "bin", "int", "nl_constr","sense","dual"])

for index, row in df.iterrows():
    instance = row['instance'].lower()
    sense = row['sense']
    if float(row['dual']) != 0.0:
        continue

    page = requests.get("http://www.gamsworld.org/minlp/minlplib2/html/"+instance+".html")

    # parse the html using beautiful soup and store in variable `soup`
    soup = BeautifulSoup(page.text, "html.parser")

    tables = soup.find_all("table")
    trs = tables[1].find_all("tr")

    dual_bounds = []
    for tr in trs:
        tds = tr.find_all("td")
        span_tds0 = tds[0].find_all("span")
        if "Dual Bounds" in span_tds0[0].get_text():
            divs = tds[1].find_all("div")
            for div in divs:
                div_text = div.get_text()
                bound_obj = re.search(r"-?\d+\.\d+", div_text)
                dual_bounds.append(float(bound_obj.group()))


    if sense == "Min":
        dual_bound = max(dual_bounds)
    else:
        dual_bound = min(dual_bounds)

    df.ix[index,'dual'] = dual_bound
    print("Instance: ", instance)
    print("Dual Bound: ", dual_bound)
    print("===================================")

    df.to_csv("data/minlib_extra_data.csv", index=False, header=False)