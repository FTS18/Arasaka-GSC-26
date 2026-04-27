import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({ title, description }) => {
    const location = useLocation();

    useEffect(() => {
        const baseTitle = "JANRAKSHAK";
        document.title = title ? `${title} | ${baseTitle}` : baseTitle;

        if (description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', description);
            }
        }
    }, [title, description, location]);

    return null;
};

export default SEO;
