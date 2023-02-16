import { useState, useEffect } from "react";
//import { getHoursCloseTicketsAuto } from "../../config";
import toastError from "../../errors/toastError";

import api from "../../services/api";
import jwt_decode from "jwt-decode";

const useTickets = ({
    searchParam,
    pageNumber,
    status,
    date,
    showAll,
    queueIds,
    withUnreadMessages,
}) => {
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [count, setCount] = useState(0); 
 
    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchTickets = async() => {
                const token = localStorage.getItem("token");
                const userJWT = jwt_decode(token);

                let horasFecharAutomaticamente = 0;

                if (userJWT.companyId > 0) {
                    const { data } = await api.get("/settings");
                    const { value } = data.find(s => s.key === 'ticketAutoClose');
                    horasFecharAutomaticamente = value;
                }

                try {
                    const { data } = await api.get("/tickets", {
                        params: {
                            searchParam,
                            pageNumber,
                            status,
                            date,
                            showAll,
                            queueIds,
                            withUnreadMessages,
                        },
                    })
                    setTickets(data.tickets);
 
                    if (status === "open" && horasFecharAutomaticamente && horasFecharAutomaticamente !== "" &&
                        horasFecharAutomaticamente !== "0" && Number(horasFecharAutomaticamente) > 0) {

                        let dataLimite = new Date();
                        dataLimite.setHours(dataLimite.getHours() - Number(horasFecharAutomaticamente));
                        
                        data.tickets.forEach(ticket => {
                            if (ticket.status !== "closed") {
                                let dataUltimaInteracaoChamado = new Date(ticket.updatedAt);
                                
                                if (dataUltimaInteracaoChamado < dataLimite) {
                                    closeTicket(ticket);
                                }
                            }
                        })
                    }

                    setHasMore(data.hasMore);
                    setCount(data.count);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                    toastError(err);
                }
            }

            const closeTicket = async(ticket) => {
                await api.put(`/tickets/${ticket.id}`, {
                    status: "closed",
                    userId: ticket.userId || null,
                })
            }

            fetchTickets()
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [
        searchParam,
        pageNumber,
        status,
        date,
        showAll,
        queueIds,
        withUnreadMessages,
    ])
 
    return { tickets, loading, hasMore, count };
};

export default useTickets;