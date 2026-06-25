import clsx from 'clsx';

const SkeletonJobCard = ({ className }) => {
    return (
        <div className={clsx("bg-white rounded-[16px] md:rounded-[24px] p-4 md:p-5 border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] animate-pulse mb-4", className)}>
            <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flex gap-3 md:gap-4 w-full">
                    <div className="w-12 h-12 rounded-xl md:rounded-2xl bg-slate-200 shrink-0"></div>
                    <div className="space-y-2.5 pt-1 flex-1">
                        <div className="h-4 w-3/4 max-w-[160px] bg-slate-200 rounded-md"></div>
                        <div className="h-3 w-1/2 max-w-[100px] bg-slate-100 rounded-md"></div>
                    </div>
                </div>
                <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0"></div>
            </div>
            <div className="mt-4 flex flex-col">
                <div className="h-4 w-20 bg-blue-50 rounded-md self-end mb-3"></div>
                <div className="flex justify-between items-center w-full gap-2 mt-auto">
                    <div className="flex gap-2">
                        <div className="h-6 w-14 bg-slate-50 border border-slate-100 rounded-md"></div>
                        <div className="h-6 w-14 bg-slate-50 border border-slate-100 rounded-md"></div>
                    </div>
                    <div className="h-3.5 w-24 bg-slate-50 rounded-md"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonJobCard;
