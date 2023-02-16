import React, { useEffect, useState } from "react";
import Fluxograma from "@dabeng/react-orgchart";
import MyNode from "./my-node";
import { i18n } from "../../translate/i18n";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import { makeStyles } from "@material-ui/core/styles";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    }
}));

let dataset = { id: 1170, title: "CHATBOT", name: "Início" };

const MenuModal = ({ open, onClose, data }) => {

    const [loading, setLoading] = useState(false);
    const classes = useStyles();
    const handleClose = () => {
        onClose();
    };
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                //const { data } = await api.get("/bot");
                dataset = { id: 1170, title: "CHATBOT", name: "Início" };
                dataset.children = [];
                data.forEach(element => {
                    // eslint-disable-next-line
                    const descricao = //
                        element.commandType === 1 ? { msg: element.descriptionBot, type: `${i18n.t("botModal.form.commandType.options.1")}` } :
                            element.commandType === 2 ? { msg: element.descriptionBot, type: `${i18n.t("botModal.form.commandType.options.2")}` } :
                                element.commandType === 3 ? { msg: element.queue.name, type: `${i18n.t("botModal.form.commandType.options.3")}` } :
                                    element.commandType === 4 ? { msg: element.user.name, type: `${i18n.t("botModal.form.commandType.options.4")}` } : //
                                        { msg: 'Erro', type: 'Erro' };

                    let qtComandos = element.commandBot.split('.').length;
                    let code = "";
                    if (qtComandos === 1) {
                        code += "dataset.children[element.commandBot] = { id: element.commandBot, title: element.commandBot + '-' + descricao.type, name: descricao.msg };\n";
                    } else {
                        let path = "dataset";
                        for (let index = 0; index < qtComandos - 1; index++) {
                            path += `.children[${element.commandBot.split('.')[index]}]`;
                        }
                        path += ".children";
                        code += `if (!${path})\n`;
                        code += `${path} =[];\n`;
                        const obj = "{ id: parseInt(element.commandBot.split('.')[qtComandos - 1]), title: element.commandBot.split('.')[qtComandos - 1] + '-' + descricao.type, name: descricao.msg }";
                        code += `${path}[parseInt(element.commandBot.split('.')[qtComandos - 1])] = ${obj};\n`;
                    }
                    // eslint-disable-next-line
                    eval(code);
                });
                setLoading(false);
            } catch (err) {
                toastError(err);
                setLoading(false);
            }
        })();
    }, [data]);

    return (
        <div className={classes.root}>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="xl"
                fullWidth
                scroll="paper"
            >
                <DialogTitle id="form-dialog-title">
                    {`${i18n.t("bots.hierarchy.title")}`}
                </DialogTitle>
                <>
                    <Fluxograma datasource={dataset} chartClass="myChart" NodeTemplate={MyNode} />;
                </>
                {loading && <TableRowSkeleton columns={3} />}
            </Dialog>
        </div>
    );
};



export default MenuModal;